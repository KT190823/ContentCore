# Bảng đặc tả chi tiết thực thể và thuộc tính mô hình CDM

## 1. User (Người dùng)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã định danh duy nhất của người dùng |
| name | String | Optional | Tên người dùng |
| email | String | Unique, Required | Địa chỉ email của người dùng |
| emailVerified | DateTime | Optional | Thời điểm xác thực email |
| image | String | Optional | Đường dẫn ảnh đại diện |
| password | String | Optional | Mật khẩu (đã mã hóa) |
| status | Enum (Status) | Default: ACTIVE | Trạng thái hoạt động |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật lần cuối |
| pricingPlanId | String (ObjectId) | FK (PricingPlan) | Mã gói dịch vụ đang sử dụng |
| credit | Int | Default: 0 | Số dư tín dụng hiện có |
| creditUsed | Int | Default: 0 | Số tín dụng đã sử dụng |
| capacity | Int | Default: 0 | Dung lượng lưu trữ (MB) |
| capacityUsed | Int | Default: 0 | Dung lượng đã sử dụng (MB) |
| lastResetDate | DateTime | Optional | Ngày reset quota gần nhất |

## 2. Account (Tài khoản liên kết)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã định danh tài khoản liên kết |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng sở hữu |
| type | String | Required | Loại tài khoản (e.g., oauth) |
| provider | String | Required | Nhà cung cấp (e.g., google, facebook) |
| providerAccountId | String | Required | ID tại nhà cung cấp |
| refresh_token | String | Optional | Token làm mới |
| access_token | String | Optional | Token truy cập |
| expires_at | Int | Optional | Thời gian hết hạn token |
| token_type | String | Optional | Loại token |
| scope | String | Optional | Phạm vi quyền hạn |
| id_token | String | Optional | OpenID Token |
| session_state | String | Optional | Trạng thái phiên |
| status | Enum (Status) | Default: ACTIVE | Trạng thái liên kết |

## 3. Session (Phiên đăng nhập)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã phiên đăng nhập |
| sessionToken | String | Unique, Required | Token phiên |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng |
| expires | DateTime | Required | Thời điểm hết hạn |
| status | Enum (Status) | Default: ACTIVE | Trạng thái phiên |

## 4. VerificationToken (Token xác thực)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã token xác thực |
| identifier | String | Required | Định danh (thường là email) |
| token | String | Unique, Required | Chuỗi token |
| expires | DateTime | Required | Thời điểm hết hạn |
| status | Enum (Status) | Default: ACTIVE | Trạng thái token |

## 5. Channel (Kênh mạng xã hội)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã kênh |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng sở hữu |
| platform | String | Required | Nền tảng (youtube, tiktok, instagram) |
| channelId | String | Required | ID kênh trên nền tảng |
| channelName | String | Required | Tên hiển thị của kênh |
| channelImage | String | Optional | Ảnh đại diện kênh |
| accessToken | String | Optional | Token truy cập kênh |
| refreshToken | String | Optional | Token làm mới kênh |
| expiresAt | DateTime | Optional | Thời hạn token |
| status | Enum (Status) | Default: ACTIVE | Trạng thái kênh |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 6. PostYoutube (Bài đăng YouTube)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã bài đăng |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng tạo |
| title | String | Required | Tiêu đề video |
| description | String | Optional | Mô tả video |
| thumbnailUrl | String | Optional | Đường dẫn ảnh bìa |
| videoUrl | String | Optional | Đường dẫn video |
| videoType | Enum (VideoType) | Default: video | Loại video (video/shorts) |
| processStatus | Enum (PostStatus) | Default: draft | Trạng thái xử lý |
| status | Enum (Status) | Default: ACTIVE | Trạng thái bài đăng |
| scheduledAt | DateTime | Optional | Thời gian lên lịch đăng |
| publishedAt | DateTime | Optional | Thời gian đã đăng |
| views | Int | Default: 0 | Số lượt xem |
| likes | Int | Default: 0 | Số lượt thích |
| comments | Int | Default: 0 | Số lượt bình luận |
| tags | String[] | Optional | Danh sách thẻ/từ khóa |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 7. FacebookPost (Bài đăng Facebook)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã bài đăng |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng tạo |
| title | String | Required | Tiêu đề bài viết |
| description | String | Optional | Nội dung bài viết |
| thumbnailUrl | String | Optional | Đường dẫn ảnh bìa |
| imageUrl | String | Optional | Đường dẫn ảnh bài viết |
| videoUrl | String | Optional | Đường dẫn video |
| videoType | Enum (VideoType) | Default: video | Loại video |
| processStatus | Enum (PostStatus) | Default: draft | Trạng thái xử lý |
| status | Enum (Status) | Default: ACTIVE | Trạng thái bài đăng |
| scheduledAt | DateTime | Optional | Thời gian lên lịch đăng |
| publishedAt | DateTime | Optional | Thời gian đã đăng |
| views | Int | Default: 0 | Số lượt xem |
| likes | Int | Default: 0 | Số lượt thích |
| comments | Int | Default: 0 | Số lượt bình luận |
| tags | String[] | Optional | Danh sách thẻ/từ khóa |
| facebookPostId | String | Optional | ID bài viết trên Facebook |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 8. TrendingVideo (Video thịnh hành)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã nội bộ |
| videoId | String | Unique, Required | Mã video nguồn |
| title | String | Required | Tiêu đề video |
| channelName | String | Required | Tên kênh |
| channelId | String | Optional | Mã kênh nguồn |
| thumbnailUrl | String | Required | Ảnh bìa |
| views | String | Required | Số lượt xem |
| publishedAt | DateTime | Required | Thời điểm đăng |
| category | String | Optional | Danh mục |
| tags | String[] | Optional | Thẻ/Từ khóa |
| status | Enum (Status) | Default: ACTIVE | Trạng thái |
| createdAt | DateTime | Default: now() | Thời điểm thu thập |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 9. Keyword (Từ khóa)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã từ khóa |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng theo dõi |
| keyword | String | Required | Nội dung từ khóa |
| category | String | Optional | Danh mục |
| volume | Int | Optional | Lượng tìm kiếm |
| trend | String | Optional | Xu hướng (rising, stable, declining) |
| status | Enum (Status) | Default: ACTIVE | Trạng thái |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 10. RefreshToken (Token làm mới hệ thống)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã token |
| token | String | Unique, Required | Chuỗi token |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng |
| expiresAt | DateTime | Required | Thời hạn |
| status | Enum (Status) | Default: ACTIVE | Trạng thái |
| createdAt | DateTime | Default: now() | Thời điểm tạo |

## 11. PricingPlan (Gói dịch vụ)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã gói dịch vụ |
| name | String | Required | Tên gói (free, pro, ultra...) |
| price | Int | Required | Giá gói |
| currency | String | Default: "VND" | Đơn vị tiền tệ |
| billingCycle | Enum (BillingCycle) | Default: MONTHLY | Chu kỳ thanh toán |
| credit | Int | Default: 0 | Số tín dụng kèm theo |
| capacity | Int | Default: 0 | Dung lượng lưu trữ kèm theo (MB) |
| features | String[] | Optional | Các tính năng nổi bật |
| description | String | Optional | Mô tả chi tiết |
| status | Enum (Status) | Default: ACTIVE | Trạng thái |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 12. PricingPlanHistory (Lịch sử đăng ký gói)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã lịch sử |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng |
| planId | String (ObjectId) | FK (PricingPlan), Required | Mã gói dịch vụ |
| price | Int | Required | Giá tại thời điểm đăng ký |
| currency | String | Default: "VND" | Đơn vị tiền tệ |
| status | Enum (PricingHistoryStatus) | Default: SUCCESS | Trạng thái thanh toán |
| errorMessage | String | Optional | Thông báo lỗi (nếu có) |
| startDate | DateTime | Default: now() | Ngày bắt đầu |
| endDate | DateTime | Optional | Ngày kết thúc |
| expireAt | DateTime | Optional | Ngày hết hạn |
| paymentMethod | String | Optional | Phương thức thanh toán |
| transactionId | String | Optional | Mã giao dịch |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |

## 13. GenerateHistory (Lịch sử tạo nội dung AI)
| Tên thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| id | String (ObjectId) | PK, Required | Mã lịch sử |
| userId | String (ObjectId) | FK (User), Required | Mã người dùng |
| input | String | Required | Dữ liệu đầu vào |
| output | String | Required | Kết quả đầu ra |
| credit | Int | Required | Số tín dụng tiêu thụ |
| status | Enum (GenerateStatus) | Default: SUCCESS | Trạng thái tạo |
| errorMessage | String | Optional | Lỗi (nếu có) |
| createdAt | DateTime | Default: now() | Thời điểm tạo |
| updatedAt | DateTime | UpdatedAt | Thời điểm cập nhật |
